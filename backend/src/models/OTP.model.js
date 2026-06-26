const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ["login", "forgot_password"],
      default: "login",
    },
    attempts: {
      type: Number,
      default: 0,
    },
    resendCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: "0s" }, // MongoDB TTL Index: Document deletes automatically at expiresAt time
    },
  },
  { timestamps: true }
);

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
