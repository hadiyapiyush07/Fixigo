const mongoose = require("mongoose");

// Admin-managed master list: Electrician, Plumber, AC Repair, Cleaning etc.
const serviceCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, "Category name is required"],
      unique: true, trim: true,
    },
    description: { type: String, default: "" },
    icon: {
      url:      { type: String, default: null },
      publicId: { type: String, default: null },
    },
    basePrice:          { type: Number, required: true, min: 0 },
    estimatedDuration:  { type: Number, default: 60 },  // minutes  

    // Sub-services: e.g. AC Repair → ["Gas refill ₹800", "Service ₹499", "Installation ₹1500"]
    subServices: [
      {
        name:     { type: String, required: true },
        price:    { type: Number, required: true },
        duration: { type: Number, default: 60 },
      },
    ],

    isActive:  { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },  // display order on home screen
  },
  { timestamps: true }
);

const ServiceCategory = mongoose.model("ServiceCategory", serviceCategorySchema);
module.exports = ServiceCategory;
