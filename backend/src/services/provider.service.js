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
  const provider = await Provider.findOneAndUpdate(
    { userId }, { $set: updateData }, { new: true, runValidators: true }
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
  let updateData = { isOnline };
  
  // Agar location mili hai, toh DB mein update karo (Longitude hamesha pehle aata hai)
  if (latitude && longitude) {
    updateData.currentLocation = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)] 
    };
  }

  const provider = await Provider.findOneAndUpdate(
    { userId }, updateData, { new: true }
  );
  if (!provider) throw new ApiError(404, "Provider not found.");
  return { isOnline: provider.isOnline, currentLocation: provider.currentLocation };
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

module.exports = {
  getProviderById, getProviderByUserId, getNearbyProviders,
  updateProviderProfile, toggleOnlineStatus, updateLocation,
  updateAvailability, recalculateRating,
};
