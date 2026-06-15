const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    // Every provider is also a User — this links them
    userId: {
      type: mongoose.Schema.Types.ObjectId, ref: "User",
      required: true, unique: true,
    },

    // Service categories this provider can perform
    skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "ServiceCategory" }],

    bio:        { type: String, maxlength: 500, default: "" },
    experience: { type: Number, default: 0, min: 0 },  // years

    // Work portfolio photos uploaded by provider
    portfolioPhotos: [
      {
        url:      String,  // Cloudinary URL
        publicId: String,  // Cloudinary public_id for deletion
      },
    ],

    idProof: { type: String, default: null },  // Cloudinary URL of govt ID

    // Admin must approve before provider can receive jobs
    isVerified: { type: Boolean, default: false },

    // Provider toggles online/offline (like Uber driver status)
    isOnline: { type: Boolean, default: false },

    // Real-time GPS — updated by socket every 5-10 seconds while on job
    // Longitude FIRST — that is GeoJSON standard
    currentLocation: {
      type:        { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },

    serviceArea: {
      city:     { type: String, default: "" },
      pincodes: [String],
    },

    // Weekly schedule — which days and what hours
    availability: {
      monday:    { isOpen: { type: Boolean, default: true },  start: { type: String, default: "09:00" }, end: { type: String, default: "18:00" } },
      tuesday:   { isOpen: { type: Boolean, default: true },  start: { type: String, default: "09:00" }, end: { type: String, default: "18:00" } },
      wednesday: { isOpen: { type: Boolean, default: true },  start: { type: String, default: "09:00" }, end: { type: String, default: "18:00" } },
      thursday:  { isOpen: { type: Boolean, default: true },  start: { type: String, default: "09:00" }, end: { type: String, default: "18:00" } },
      friday:    { isOpen: { type: Boolean, default: true },  start: { type: String, default: "09:00" }, end: { type: String, default: "18:00" } },
      saturday:  { isOpen: { type: Boolean, default: true },  start: { type: String, default: "09:00" }, end: { type: String, default: "18:00" } },
      sunday:    { isOpen: { type: Boolean, default: false }, start: { type: String, default: "09:00" }, end: { type: String, default: "18:00" } },
    },

    // Recalculated after every new review
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },

    earnings: {
      total:     { type: Number, default: 0 },
      pending:   { type: Number, default: 0 },
      withdrawn: { type: Number, default: 0 },
    },

    totalBookings:     { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Required for $nearSphere geo queries — find providers within X km
providerSchema.index({ currentLocation: "2dsphere" });
providerSchema.index({ isVerified: 1, isOnline: 1, skills: 1 });

const Provider = mongoose.model("Provider", providerSchema);
module.exports = Provider;
