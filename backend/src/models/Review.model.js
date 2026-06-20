const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true, // Only one review per booking
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ providerId: 1 });
reviewSchema.index({ customerId: 1 });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
