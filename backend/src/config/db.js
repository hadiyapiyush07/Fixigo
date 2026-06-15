const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "servicebook",
    });

    isConnected = true;
    console.log('✅ MongoDB Connected suucessfully');

    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      console.warn("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      isConnected = true;
      console.log("✅ MongoDB reconnected");
    });

  } catch (error) {
    console.error(`❌ MongoDB failed: ${error.message}`);
    process.exit(1);  // stop server if DB connection fails
  }
};

module.exports = connectDB;
