const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null, // Only relevant for percent
    },
    minBookingAmount: {
      type: Number,
      default: 0,
    },
    usageLimitPerUser: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    usedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        usedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
