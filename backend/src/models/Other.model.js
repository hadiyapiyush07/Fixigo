const mongoose = require("mongoose");

// ── Payment ───────────────────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema(
  {
    bookingId:  { type: mongoose.Schema.Types.ObjectId, ref: "Booking",  required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },

    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },

    amount:   { type: Number, required: true },  // in paise (₹1 = 100 paise)
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["created", "paid", "failed", "refunded"],
      default: "created",
    },
    method: {
      type: String,
      enum: ["upi", "card", "netbanking", "wallet", "cash", null],
      default: null,
    },

    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });

const Payment      = mongoose.model("Payment",      paymentSchema);

module.exports = { Payment };
