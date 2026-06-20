const mongoose = require("mongoose");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "servicebook",
    });

    isConnected = true;
    console.log('✅ MongoDB Connected successfully');

    // Auto-seed default service categories if not present
    const ServiceCategory = require("../models/ServiceCategory.model");
    const count = await ServiceCategory.countDocuments({ isActive: true });
    if (count < 12) {
      console.log("🌱 Database check: Seeding missing default service categories with sub-services...");
      const defaultCategories = [
        {
          name: "AC Repair",
          basePrice: 399,
          estimatedDuration: 45,
          description: "Complete air conditioner repair, maintenance, and installation services",
          sortOrder: 1,
          isActive: true,
          subServices: [
            { name: "General Service", price: 399, duration: 45 },
            { name: "Deep Cleaning", price: 599, duration: 60 },
            { name: "Gas Refilling", price: 1200, duration: 60 },
            { name: "Installation", price: 1499, duration: 90 },
            { name: "Uninstallation", price: 499, duration: 45 },
            { name: "Water Leakage", price: 299, duration: 30 },
            { name: "Cooling Issue", price: 399, duration: 45 },
            { name: "Noise Issue", price: 299, duration: 30 },
            { name: "PCB Repair", price: 1500, duration: 60 },
            { name: "Compressor Repair", price: 2500, duration: 120 }
          ]
        },
        {
          name: "Washing Machine Repair",
          basePrice: 299,
          estimatedDuration: 45,
          description: "Repair services for front load, top load, and semi-automatic washing machines",
          sortOrder: 2,
          isActive: true,
          subServices: [
            { name: "General Service", price: 299, duration: 45 },
            { name: "Installation", price: 399, duration: 60 },
            { name: "Uninstallation", price: 199, duration: 30 },
            { name: "Drum Cleaning", price: 499, duration: 60 },
            { name: "Motor Issue", price: 999, duration: 90 },
            { name: "Water Leakage", price: 249, duration: 45 },
            { name: "Spin Issue", price: 399, duration: 60 },
            { name: "Not Starting", price: 299, duration: 45 }
          ]
        },
        {
          name: "Refrigerator Repair",
          basePrice: 299,
          estimatedDuration: 45,
          description: "Single door, double door, and side-by-side refrigerator repair",
          sortOrder: 3,
          isActive: true,
          subServices: [
            { name: "Cooling Problem", price: 399, duration: 60 },
            { name: "Gas Filling", price: 1499, duration: 90 },
            { name: "Compressor", price: 2990, duration: 120 },
            { name: "Installation", price: 499, duration: 45 },
            { name: "Uninstallation", price: 299, duration: 30 },
            { name: "Door Repair", price: 349, duration: 45 },
            { name: "Water Leakage", price: 299, duration: 60 }
          ]
        },
        {
          name: "Electrician",
          basePrice: 79,
          estimatedDuration: 15,
          description: "Fan, light, switchboard repairs, wiring, and other electrical work",
          sortOrder: 4,
          isActive: true,
          subServices: [
            { name: "Fan", price: 149, duration: 30 },
            { name: "Light", price: 99, duration: 20 },
            { name: "Switch", price: 79, duration: 15 },
            { name: "Socket", price: 89, duration: 15 },
            { name: "Wiring", price: 499, duration: 90 },
            { name: "Door Bell", price: 129, duration: 20 },
            { name: "MCB", price: 199, duration: 30 },
            { name: "Inverter", price: 399, duration: 45 }
          ]
        },
        {
          name: "Plumber",
          basePrice: 99,
          estimatedDuration: 20,
          description: "Tap, pipe repair, blockage clearing, and sanitary fittings installation",
          sortOrder: 5,
          isActive: true,
          subServices: [
            { name: "Tap Repair", price: 99, duration: 20 },
            { name: "Leakage", price: 199, duration: 45 },
            { name: "Bathroom", price: 499, duration: 90 },
            { name: "Kitchen", price: 399, duration: 60 },
            { name: "Flush Tank", price: 249, duration: 45 },
            { name: "Drain Block", price: 299, duration: 45 },
            { name: "Water Motor", price: 499, duration: 60 }
          ]
        },
        {
          name: "Carpenter",
          basePrice: 149,
          estimatedDuration: 30,
          description: "Furniture repair, assembly, door, window alignment, and lock fitting",
          sortOrder: 6,
          isActive: true,
          subServices: [
            { name: "Furniture Repair", price: 199, duration: 45 },
            { name: "Assembly", price: 399, duration: 60 },
            { name: "Door Alignment", price: 149, duration: 30 },
            { name: "Window Alignment", price: 149, duration: 30 },
            { name: "Lock Fitting", price: 249, duration: 45 },
            { name: "General Carpentry", price: 299, duration: 60 }
          ]
        },
        {
          name: "RO Service",
          basePrice: 299,
          estimatedDuration: 45,
          description: "RO water purifier servicing, filter changes, and installation",
          sortOrder: 7,
          isActive: true,
          subServices: [
            { name: "Filter Change", price: 1499, duration: 60 },
            { name: "RO Servicing", price: 399, duration: 45 },
            { name: "Installation", price: 499, duration: 60 },
            { name: "Water Purifier Repair", price: 299, duration: 45 }
          ]
        },
        {
          name: "Painting",
          basePrice: 199,
          estimatedDuration: 30,
          description: "Interior, exterior wall painting, touch-ups, and waterproof coating",
          sortOrder: 8,
          isActive: true,
          subServices: [
            { name: "Wall Painting", price: 1999, duration: 180 },
            { name: "Wall Touch-ups", price: 499, duration: 60 },
            { name: "Waterproof Coating", price: 2499, duration: 120 },
            { name: "General Painting Consult", price: 199, duration: 30 }
          ]
        },
        {
          name: "Home Cleaning",
          basePrice: 299,
          estimatedDuration: 45,
          description: "Full home deep cleaning, bathroom, kitchen, sofa, and carpet cleaning",
          sortOrder: 9,
          isActive: true,
          subServices: [
            { name: "Bathroom Deep Cleaning", price: 399, duration: 60 },
            { name: "Kitchen Deep Cleaning", price: 899, duration: 120 },
            { name: "Sofa Cleaning", price: 499, duration: 60 },
            { name: "Carpet Cleaning", price: 299, duration: 45 },
            { name: "Full Home Deep Cleaning", price: 2999, duration: 240 }
          ]
        },
        {
          name: "Pest Control",
          basePrice: 599,
          estimatedDuration: 60,
          description: "Cockroach, bed bug, termite, rodent control, and sanitization",
          sortOrder: 10,
          isActive: true,
          subServices: [
            { name: "Cockroach Control", price: 699, duration: 60 },
            { name: "Termite Control", price: 1499, duration: 90 },
            { name: "Rodent Control", price: 599, duration: 60 },
            { name: "Bed Bug Treatment", price: 899, duration: 90 }
          ]
        },
        {
          name: "CCTV Installation",
          basePrice: 299,
          estimatedDuration: 45,
          description: "Security camera installation, config, and maintenance",
          sortOrder: 11,
          isActive: true,
          subServices: [
            { name: "CCTV Setup", price: 999, duration: 120 },
            { name: "Camera Configuration", price: 399, duration: 45 },
            { name: "Camera Repair", price: 299, duration: 60 }
          ]
        },
        {
          name: "Water Purifier Service",
          basePrice: 199,
          estimatedDuration: 30,
          description: "General maintenance, service, and filter replacement for purifiers",
          sortOrder: 12,
          isActive: true,
          subServices: [
            { name: "Service & Cleaning", price: 349, duration: 45 },
            { name: "Filter Replacement", price: 999, duration: 60 },
            { name: "Leakage Repair", price: 199, duration: 30 }
          ]
        }
      ];

      for (const cat of defaultCategories) {
        const exists = await ServiceCategory.findOne({ name: cat.name });
        if (!exists) {
          await ServiceCategory.create(cat);
        }
      }
      console.log("✅ Default service categories verified/seeded with sub-services.");
    }

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
    process.exit(1);
  }
};

module.exports = connectDB;
