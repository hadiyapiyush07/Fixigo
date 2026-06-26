const mongoose = require("mongoose");
const Coupon = require("./src/models/Coupon.model");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const seedCoupon = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/fixigo", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Check if WELCOME100 exists
    const existing = await Coupon.findOne({ code: "WELCOME100" });
    if (!existing) {
      await Coupon.create({
        code: "WELCOME100",
        description: "On your first booking",
        discountType: "flat",
        discountValue: 100,
        minBookingAmount: 0,
        usageLimitPerUser: 1,
        isActive: true,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
      });
      console.log("Seeded WELCOME100 coupon!");
    } else {
      console.log("WELCOME100 already exists.");
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedCoupon();
