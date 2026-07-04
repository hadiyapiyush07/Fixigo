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
    aadhaar: { type: String, default: null },
    pan: { type: String, default: null },
    selfie: { type: String, default: null },
    workingRadius: { type: Number, default: 10 }, // in km
    emergencyContact: { type: String, default: null },
    bankDetails: {
      accountNo: { type: String, default: null },
      ifscCode: { type: String, default: null },
      accountHolderName: { type: String, default: null }
    },
    status: { type: String, enum: ["offline", "available", "busy"], default: "offline" },
    address: { type: String, default: null },

    // Admin must approve before provider can receive jobs
    isVerified: { type: Boolean, default: false },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected", "suspended"], default: "pending" },

    // For background heartbeat system
    lastSeen: { type: Date, default: Date.now },

    // Performance & Analytics Score (for smart matching)
    metrics: {
      rating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      acceptedJobs: { type: Number, default: 0 },
      rejectedJobs: { type: Number, default: 0 },
      missedRequests: { type: Number, default: 0 },
      completedJobs: { type: Number, default: 0 },
      cancelledJobs: { type: Number, default: 0 },
      averageResponseTime: { type: Number, default: 0 }, // in seconds
      completionRate: { type: Number, default: 100 },    // percentage
      acceptanceRate: { type: Number, default: 100 },    // percentage
      cancellationRate: { type: Number, default: 0 }     // percentage
    },

    // Real-time GPS — updated by socket every 5-10 seconds while on job
    // Longitude FIRST — that is GeoJSON standard
    currentLocation: {
      type:        { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    heading: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    lastLocationUpdated: { type: Date, default: Date.now },

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

providerSchema.index({ currentLocation: "2dsphere" });
providerSchema.index({ isVerified: 1, status: 1, skills: 1 });
providerSchema.index({ status: 1, lastSeen: 1 }); // For heartbeat timeout sweeps

const Provider = mongoose.model("Provider", providerSchema);
module.exports = Provider;
