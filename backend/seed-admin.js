const mongoose = require("mongoose");
const Admin = require("./src/models/Admin.model");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const superAdmin = await Admin.create({
      name: "Super Admin",
      email: "admin@fixigo.com",
      password: "password123",
      role: "superadmin",
      permissions: ["*"],
      isActive: true,
    });

    console.log("Super Admin seeded successfully:", superAdmin.email);
    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
};

seedAdmin();
