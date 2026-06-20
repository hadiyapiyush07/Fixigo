const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema({
  settlementId: {
    type: String,
    required: true,
    unique: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Provider",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["bank_transfer", "upi", "wallet"],
    required: true
  },
  transferStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending"
  },
  transferDate: {
    type: Date,
    default: null
  },
  bookingIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking"
  }],
  transactionReference: {
    type: String,
    default: null
  }
}, { timestamps: true });

settlementSchema.index({ providerId: 1, transferStatus: 1, createdAt: -1 });

module.exports = mongoose.models.Settlement || mongoose.model("Settlement", settlementSchema);
