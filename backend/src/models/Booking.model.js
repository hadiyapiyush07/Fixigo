const mongoose = require("mongoose");

// Booking status state machine:
// pending → confirmed → provider_on_the_way → in_progress → completed
//        ↘ cancelled (by customer or provider)
//        ↘ rejected  (no provider accepted)

const bookingSchema = new mongoose.Schema(
  {
    customerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User",            required: true },
    providerId:  { type: mongoose.Schema.Types.ObjectId, ref: "Provider",        default: null },
    categoryId:  { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory", required: true },

    subService: {
      name:  { type: String, default: "" },
      price: { type: Number, default: 0 },
    },
    description: { type: String, default: "", maxlength: 500 },

    scheduledDate: { type: Date,   required: true },
    scheduledTime: { type: String, required: true },  // "10:00 AM"

    address: {
      addressLine: { type: String, required: true },
      city:        { type: String, required: true },
      pincode:     { type: String, required: true },
      location: {
        type:        { type: String, default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },  // [longitude, latitude]
      },
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "provider_on_the_way", "in_progress", "completed", "cancelled", "rejected"],
      default: "pending",
    },

    // Full audit trail of every status change
    statusHistory: [
      {
        status:    String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note:      String,
      },
    ],

    // Providers who have already rejected — never notify them again
    rejectedProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Provider" }],

    // If provider doesn't respond in 2 minutes → try next provider
    providerResponseDeadline: { type: Date, default: null },

    pricing: {
      baseAmount:     { type: Number, default: 0 },
      discount:       { type: Number, default: 0 },
      convenienceFee: { type: Number, default: 0 },
      totalAmount:    { type: Number, default: 0 },
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "wallet", "cash", null],
      default: null,
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },

    cancellation: {
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason:      String,
      cancelledAt: Date,
    },

    isRated:    { type: Boolean, default: false },
    reviewId:   { type: mongoose.Schema.Types.ObjectId, ref: "Review", default: null },

    acceptedAt:   { type: Date, default: null },
    startedAt:    { type: Date, default: null },
    completedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ providerId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ "address.location": "2dsphere" });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
