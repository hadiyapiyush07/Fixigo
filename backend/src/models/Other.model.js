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

// ── Review ────────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    bookingId:  { type: mongoose.Schema.Types.ObjectId, ref: "Booking",  required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    comment:    { type: String, maxlength: 500, default: "" },
    tags:       [{ type: String }],  // ["On time", "Professional", "Good work"]
  },
  { timestamps: true }
);
reviewSchema.index({ providerId: 1, createdAt: -1 });

// ── Notification ──────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title:  { type: String, required: true },
    body:   { type: String, required: true },
    type: {
      type: String,
      enum: ["booking_request", "booking_confirmed", "booking_cancelled",
             "booking_completed", "payment_success", "new_review", "system"],
    },
    data:   { type: mongoose.Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Payment      = mongoose.model("Payment",      paymentSchema);
const Review       = mongoose.model("Review",       reviewSchema);
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = { Payment, Review, Notification };
