// ════════════════════════════════════════════════════════════
// provider.service.js
// ════════════════════════════════════════════════════════════
const Provider  = require("../models/Provider.model");
const Review    = require("../models/Other.model").Review;
const ApiError  = require("../utils/ApiError");
const { getPagination, paginate } = require("../utils/pagination");

const getProviderById = async (providerId) => {
  const provider = await Provider.findById(providerId)
    .populate("userId",  "name email phone profilePhoto")
    .populate("skills",  "name icon basePrice");
  if (!provider) throw new ApiError(404, "Provider not found.");
  return provider;
};

const getProviderByUserId = async (userId) => {
  const provider = await Provider.findOne({ userId })
    .populate("userId", "name email phone profilePhoto")
    .populate("skills", "name icon basePrice");
  if (!provider) throw new ApiError(404, "Provider profile not found.");
  return provider;
};

// Core Urban Company algorithm — find nearest online verified providers
const getNearbyProviders = async ({ latitude, longitude, categoryId, radiusKm = 10, query }) => {
  const { page, limit, skip } = getPagination(query);

  const filter = {
    isVerified: true,
    isOnline:   true,
    ...(categoryId && { skills: categoryId }),
    currentLocation: {
      $nearSphere: {
        $geometry: {
          type:        "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)], // longitude FIRST
        },
        $maxDistance: radiusKm * 1000, // km to metres
      },
    },
  };

  // $nearSphere sorts by distance — fetch all then slice for pagination
  const all   = await Provider.find(filter)
    .populate("userId", "name profilePhoto")
    .populate("skills", "name icon")
    .select("-availability -earnings -rejectedProviders");

  const total = all.length;
  const data  = all.slice(skip, skip + limit);
  return paginate(data, total, page, limit);
};

const updateProviderProfile = async (userId, updateData) => {
  const User = require("../models/User.model");
  const Provider = require("../models/Provider.model");
  const { cloudinary } = require("../config/cloudinary");

  // Validate Aadhaar (if provided)
  if (updateData.aadhaar !== undefined) {
    if (!/^\d{12}$/.test(updateData.aadhaar)) {
      throw new ApiError(400, "Invalid Aadhaar number. Must be exactly 12 digits.");
    }
  }

  // Validate PAN (if provided, optional but must be valid shape)
  if (updateData.pan) {
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(updateData.pan.toUpperCase())) {
      throw new ApiError(400, "Invalid PAN number format (expected e.g. ABCDE1234F).");
    }
    updateData.pan = updateData.pan.toUpperCase();
  }

  // Validate Emergency Contact (if provided)
  if (updateData.emergencyContact !== undefined) {
    if (!/^[6-9]\d{9}$/.test(updateData.emergencyContact)) {
      throw new ApiError(400, "Invalid Emergency Contact number. Must be a valid 10-digit Indian number.");
    }
  }

  // Validate working radius
  if (updateData.workingRadius !== undefined) {
    const radius = Number(updateData.workingRadius);
    if (isNaN(radius) || radius <= 0 || radius > 100) {
      throw new ApiError(400, "Invalid Working Radius. Must be a positive number up to 100 KM.");
    }
  }

  const uploadBase64 = async (base64Str, folder) => {
    try {
      const result = await cloudinary.uploader.upload(base64Str, { folder });
      return { url: result.secure_url, publicId: result.public_id };
    } catch (e) {
      console.error("Cloudinary upload failed:", e);
      throw new ApiError(500, `Failed to upload image to Cloudinary: ${e.message}`);
    }
  };

  // Base64 document upload checks
  if (updateData.profilePhoto && updateData.profilePhoto.startsWith("data:image")) {
    const uploaded = await uploadBase64(updateData.profilePhoto, "servicebook/profiles");
    updateData.profilePhoto = uploaded.url;
    updateData.profilePhotoPublicId = uploaded.publicId;
  }
  if (updateData.idProof && updateData.idProof.startsWith("data:image")) {
    const uploaded = await uploadBase64(updateData.idProof, "servicebook/documents");
    updateData.idProof = uploaded.url;
  }
  if (updateData.selfie && updateData.selfie.startsWith("data:image")) {
    const uploaded = await uploadBase64(updateData.selfie, "servicebook/selfies");
    updateData.selfie = uploaded.url;
  }

  // Update associated User model fields if provided
  const userUpdates = {};
  if (updateData.name !== undefined) userUpdates.name = updateData.name;
  if (updateData.profilePhoto !== undefined) userUpdates.profilePhoto = updateData.profilePhoto;
  if (updateData.profilePhotoPublicId !== undefined) userUpdates.profilePhotoPublicId = updateData.profilePhotoPublicId;

  if (Object.keys(userUpdates).length > 0) {
    await User.findByIdAndUpdate(userId, userUpdates, { runValidators: true });
  }

  // Remove User specific fields from Provider update body
  const providerUpdates = { ...updateData };
  delete providerUpdates.name;
  delete providerUpdates.profilePhoto;
  delete providerUpdates.profilePhotoPublicId;

  // Verify skills if skills array is supplied (convert IDs to ObjectIds)
  if (providerUpdates.skills && Array.isArray(providerUpdates.skills)) {
    const mongoose = require("mongoose");
    providerUpdates.skills = providerUpdates.skills.map(s => new mongoose.Types.ObjectId(s));
  }

  // Check if provider is already verified to avoid resetting their status on edits
  const currentProvider = await Provider.findOne({ userId });
  if (currentProvider && (currentProvider.isVerified || currentProvider.verificationStatus === "verified")) {
    providerUpdates.verificationStatus = "verified";
    providerUpdates.isVerified = true;
    providerUpdates.isOnline = currentProvider.isOnline;
    providerUpdates.status = currentProvider.status;
  } else {
    // Reset verification to pending and status to offline for new/unverified providers
    providerUpdates.verificationStatus = "pending";
    providerUpdates.isVerified = false;
    providerUpdates.isOnline = false;
    providerUpdates.status = "offline";
  }

  const provider = await Provider.findOneAndUpdate(
    { userId }, { $set: providerUpdates }, { new: true, runValidators: true }
  ).populate("userId", "name email phone profilePhoto");

  if (!provider) throw new ApiError(404, "Provider profile not found.");
  return provider;
};

// const toggleOnlineStatus = async (userId, isOnline) => {
//   const provider = await Provider.findOneAndUpdate(
//     { userId }, { isOnline }, { new: true }
//   );
//   if (!provider) throw new ApiError(404, "Provider not found.");
//   return { isOnline: provider.isOnline };
// };

const toggleOnlineStatus = async (userId, isOnline, latitude, longitude) => {
  const provider = await Provider.findOne({ userId });
  if (!provider) throw new ApiError(404, "Provider profile not found.");

  if (provider.status === "busy") {
    throw new ApiError(400, "You cannot change your status while you are busy on an active job.");
  }

  if (isOnline && !provider.isVerified) {
    if (provider.verificationStatus === "rejected") {
      throw new ApiError(403, "Your profile verification was rejected. Please update your profile or contact support.");
    }
    throw new ApiError(403, "Your profile is under verification. Please wait until the admin approves your account.");
  }

  let updateData = { isOnline, status: isOnline ? "online" : "offline" };
  
  // Agar location mila hai, toh DB mein update karo (Longitude hamesha pehle aata hai)
  if (latitude && longitude) {
    updateData.currentLocation = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)] 
    };
  }

  const updated = await Provider.findOneAndUpdate(
    { userId }, updateData, { new: true }
  );
  return { isOnline: updated.isOnline, status: updated.status, currentLocation: updated.currentLocation };
};

const updateLocation = async (userId, longitude, latitude) => {
  await Provider.findOneAndUpdate(
    { userId },
    { currentLocation: { type: "Point", coordinates: [longitude, latitude] } }
  );
};

const updateAvailability = async (userId, availability) => {
  const provider = await Provider.findOneAndUpdate(
    { userId }, { availability }, { new: true }
  );
  if (!provider) throw new ApiError(404, "Provider not found.");
  return provider.availability;
};

const recalculateRating = async (providerId) => {
  const stats = await Review.aggregate([
    { $match: { providerId: providerId } },
    { $group: { _id: "$providerId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Provider.findByIdAndUpdate(providerId, {
      "rating.average": Math.round(stats[0].avgRating * 10) / 10,
      "rating.count":   stats[0].count,
    });
  }
};

// ── Live dashboard stats from MongoDB ────────────────────────────────────
// Returns real-time counts — never reads stale cached fields on Provider model
const getProviderStats = async (userId) => {
  const Booking  = require("../models/Booking.model");
  const mongoose = require("mongoose");

  const provider = await Provider.findOne({ userId }).select("_id");
  if (!provider) throw new ApiError(404, "Provider not found.");

  const providerId = provider._id;

  // Start of today (midnight in local time)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [total, completed, todayJobs, earningsAgg] = await Promise.all([
    // Total bookings ever assigned to this provider
    Booking.countDocuments({ providerId }),

    // Completed bookings
    Booking.countDocuments({ providerId, status: "completed" }),

    // Bookings created today
    Booking.countDocuments({ providerId, createdAt: { $gte: todayStart } }),

    // Sum of totalAmount for completed bookings
    Booking.aggregate([
      { $match: { providerId: new mongoose.Types.ObjectId(providerId), status: "completed" } },
      { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } },
    ]),
  ]);

  const earnings = earningsAgg[0]?.total || 0;

  return { total, completed, todayJobs, earnings };
};

module.exports = {
  getProviderById, getProviderByUserId, getNearbyProviders,
  updateProviderProfile, toggleOnlineStatus, updateLocation,
  updateAvailability, recalculateRating, getProviderStats,
};

