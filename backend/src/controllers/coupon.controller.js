const Coupon = require("../models/Coupon.model");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const applyCoupon = asyncHandler(async (req, res) => {
  const { code, basePrice } = req.body;
  if (!code || basePrice === undefined) {
    throw new ApiError(400, "Coupon code and basePrice are required.");
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    throw new ApiError(404, "Invalid or expired coupon.");
  }

  if (coupon.expiryDate && new Date() > coupon.expiryDate) {
    throw new ApiError(400, "This coupon has expired.");
  }

  if (basePrice < coupon.minBookingAmount) {
    throw new ApiError(400, `Minimum booking amount for this coupon is ₹${coupon.minBookingAmount}`);
  }

  // Check usage limit
  const userUsage = coupon.usedBy.filter(u => String(u.userId) === String(req.user._id)).length;
  if (userUsage >= coupon.usageLimitPerUser) {
    throw new ApiError(400, "You have already used this coupon.");
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === "flat") {
    discountAmount = coupon.discountValue;
  } else if (coupon.discountType === "percent") {
    discountAmount = (basePrice * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  }

  // Ensure discount doesn't exceed base price
  if (discountAmount > basePrice) {
    discountAmount = basePrice;
  }

  res.status(200).json(
    new ApiResponse(200, {
      code: coupon.code,
      discountAmount: Math.round(discountAmount),
      description: coupon.description
    }, "Coupon applied successfully!")
  );
});

const getActiveCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({
    isActive: true,
    $or: [
      { expiryDate: null },
      { expiryDate: { $gt: new Date() } }
    ]
  });

  // Filter out coupons that the user has already used up to their limit
  const userIdStr = String(req.user._id);
  const availableCoupons = coupons.filter(c => {
    const usageCount = c.usedBy.filter(u => String(u.userId) === userIdStr).length;
    return usageCount < c.usageLimitPerUser;
  });

  res.status(200).json(new ApiResponse(200, availableCoupons, "Active coupons fetched successfully."));
});

const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, coupons, "Coupons fetched successfully."));
});

const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, description, maxDiscount, expiryDate, isOneTime } = req.body;
  if (!code || !discountType || !discountValue) {
    throw new ApiError(400, "Code, discount type, and value are required.");
  }
  
  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    throw new ApiError(400, "Coupon code already exists.");
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    discountType: discountType === 'percentage' ? 'percent' : 'flat',
    discountValue,
    description,
    maxDiscount,
    expiryDate,
    usageLimitPerUser: isOneTime ? 1 : 100 // enforce one time limit
  });
  
  res.status(201).json(new ApiResponse(201, coupon, "Coupon created successfully."));
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) throw new ApiError(404, "Coupon not found");
  res.status(200).json(new ApiResponse(200, {}, "Coupon deleted successfully."));
});

module.exports = {
  applyCoupon,
  getActiveCoupons,
  getAllCoupons,
  createCoupon,
  deleteCoupon
};
