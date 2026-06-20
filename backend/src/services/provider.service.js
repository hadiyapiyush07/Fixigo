// ════════════════════════════════════════════════════════════
// provider.service.js
// ════════════════════════════════════════════════════════════
const Provider  = require("../models/Provider.model");
const Review    = require("../models/Review.model");
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

const updateLocation = async (userId, longitude, latitude, heading = 0, speed = 0) => {
  await Provider.findOneAndUpdate(
    { userId },
    { 
      currentLocation: { type: "Point", coordinates: [longitude, latitude] },
      heading,
      speed,
      lastLocationUpdated: new Date()
    }
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

  const providerId = new mongoose.Types.ObjectId(provider._id);

  // Start of today (midnight in local time)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Use a single aggregation pipeline with $facet to compute all 8 stats simultaneously
  const statsResult = await Booking.aggregate([
    { $match: { providerId: providerId } },
    {
      $facet: {
        totalDocs: [{ $count: "count" }],
        completedDocs: [
          { $match: { status: "completed" } },
          { $count: "count" }
        ],
        cancelledDocs: [
          { $match: { status: "cancelled" } },
          { $count: "count" }
        ],
        todayDocs: [
          { $match: { createdAt: { $gte: todayStart } } },
          { $count: "count" }
        ],
        earningsAgg: [
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
        ],
        todayEarningsAgg: [
          { $match: { status: "completed", createdAt: { $gte: todayStart } } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
        ],
        pendingPaymentsAgg: [
          { $match: { status: "payment_pending" } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
        ],
        onlinePaymentsAgg: [
          { $match: { status: "completed", paymentMethod: { $in: ["razorpay", "wallet"] } } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
        ],
        cashPaymentsAgg: [
          { $match: { status: "completed", paymentMethod: "cash" } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
        ]
      }
    }
  ]);

  const stats = statsResult[0];

  return {
    total:           stats.totalDocs[0]?.count || 0,
    completed:       stats.completedDocs[0]?.count || 0,
    cancelled:       stats.cancelledDocs[0]?.count || 0,
    todayJobs:       stats.todayDocs[0]?.count || 0,
    earnings:        stats.earningsAgg[0]?.total || 0,
    todayEarnings:   stats.todayEarningsAgg[0]?.total || 0,
    pendingPayments: stats.pendingPaymentsAgg[0]?.total || 0,
    onlinePayments:  stats.onlinePaymentsAgg[0]?.total || 0,
    cashPayments:    stats.cashPaymentsAgg[0]?.total || 0,
  };
};

const getProviderEarnings = async (providerId, timeframe) => {
  const Settlement = require("../models/Settlement.model");
  const mongoose = require("mongoose");
  
  let dateFilter = {};
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  if (timeframe === "this_week") {
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: weekStart } };
  } else if (timeframe === "this_month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { createdAt: { $gte: monthStart } };
  }

  // Transaction History (from timeframe)
  const transactions = await Booking.find({
    providerId: providerId,
    status: { $in: ["completed", "payment_pending"] },
    ...dateFilter
  })
    .sort({ createdAt: -1 })
    .populate("customerId", "name")
    .select("pricing customerId subService status createdAt paymentMethod");

  // Format transaction history
  const history = transactions.map(t => ({
    id: t._id,
    service: t.subService?.name || "Service",
    customer: t.customerId?.name || "Customer",
    amount: t.pricing?.totalAmount || 0,
    date: t.createdAt,
    status: t.status === "completed" ? "paid" : "pending",
    paymentMethod: t.paymentMethod || "online"
  }));

  // Aggregations for timeframe
  const earningsAgg = await Booking.aggregate([
    { $match: { providerId: new mongoose.Types.ObjectId(providerId), ...dateFilter } },
    {
      $facet: {
        totalDocs: [
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
        ],
        pendingDocs: [
          { $match: { status: "payment_pending" } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
        ],
        cashDocs: [
          { $match: { status: "completed", paymentMethod: "cash" } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
        ],
        onlineDocs: [
          { $match: { status: "completed", paymentMethod: { $in: ["razorpay", "wallet", "online"] } } },
          { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
        ]
      }
    }
  ]);

  const stats = earningsAgg[0];
  const timeframeEarnings = stats.totalDocs[0]?.total || 0;
  const pendingAmount = stats.pendingDocs[0]?.total || 0;
  const cashPayments = stats.cashDocs[0]?.total || 0;
  const onlinePayments = stats.onlineDocs[0]?.total || 0;

  // Today's Earnings (Always today, regardless of timeframe)
  const todayAgg = await Booking.aggregate([
    { $match: { providerId: new mongoose.Types.ObjectId(providerId), status: "completed", createdAt: { $gte: todayStart } } },
    { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
  ]);
  const todayEarnings = todayAgg[0]?.total || 0;

  // Settlements (All time for calculating withdrawable, but we can return recent ones)
  const allCompletedOnlineAgg = await Booking.aggregate([
    { $match: { providerId: new mongoose.Types.ObjectId(providerId), status: "completed", paymentMethod: { $in: ["razorpay", "wallet", "online"] } } },
    { $group: { _id: null, total: { $sum: "$pricing.totalAmount" } } }
  ]);
  const allTimeOnline = allCompletedOnlineAgg[0]?.total || 0;

  const settledAgg = await Settlement.aggregate([
    { $match: { providerId: new mongoose.Types.ObjectId(providerId), transferStatus: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const alreadySettled = settledAgg[0]?.total || 0;
  
  // Withdrawable Balance calculation
  const withdrawableBalance = Math.max(0, allTimeOnline - alreadySettled);

  // Settlement History
  const settlementHistory = await Settlement.find({ providerId })
    .sort({ createdAt: -1 })
    .limit(20);

  return {
    totalEarnings: timeframeEarnings,
    todayEarnings,
    pendingAmount,
    withdrawableBalance,
    cashPayments,
    onlinePayments,
    history,
    settlementHistory
  };
};

module.exports = {
  getProviderById, getProviderByUserId, getNearbyProviders,
  updateProviderProfile, toggleOnlineStatus, updateLocation,
  updateAvailability, recalculateRating, getProviderStats, getProviderEarnings,
};

