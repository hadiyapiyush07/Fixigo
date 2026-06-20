const asyncHandler      = require("../utils/asyncHandler");
const ApiResponse       = require("../utils/ApiResponse");
const ApiError          = require("../utils/ApiError");
const providerService   = require("../services/provider.service");

// GET /api/providers/nearby?latitude=21.17&longitude=72.83&categoryId=xxx&page=1&limit=10
const getNearbyProviders = asyncHandler(async (req, res) => {
  const { latitude, longitude, categoryId } = req.query;
  if (!latitude || !longitude) throw new ApiError(400, "latitude and longitude are required.");

  const result = await providerService.getNearbyProviders({
    latitude, longitude, categoryId, radiusKm: 10, query: req.query,
  });
  res.status(200).json(new ApiResponse(200, result, "Nearby providers fetched."));
});

// GET /api/providers/me  (provider's own profile)
const getMyProviderProfile = asyncHandler(async (req, res) => {
  const provider = await providerService.getProviderByUserId(req.user._id);
  res.status(200).json(new ApiResponse(200, provider));
});

// GET /api/providers/:id
const getProviderById = asyncHandler(async (req, res) => {
  const provider = await providerService.getProviderById(req.params.id);
  res.status(200).json(new ApiResponse(200, provider));
});

// PUT /api/providers/profile
const updateProviderProfile = asyncHandler(async (req, res) => {
  const allowed = [
    "name", "profilePhoto", "bio", "experience", "skills", "serviceArea", "aadhaar", "pan", "selfie",
    "workingRadius", "emergencyContact", "bankDetails", "status", "idProof", "address"
  ];
  const updateData = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updateData[key] = req.body[key];
  });
  const provider = await providerService.updateProviderProfile(req.user._id, updateData);
  res.status(200).json(new ApiResponse(200, provider, "Profile updated."));
});

// PUT /api/providers/online-status
// const toggleOnlineStatus = asyncHandler(async (req, res) => {
//   const { isOnline } = req.body;
//   if (typeof isOnline !== "boolean") throw new ApiError(400, "isOnline must be true or false.");
//   const result = await providerService.toggleOnlineStatus(req.user._id, isOnline);
//   res.status(200).json(
//     new ApiResponse(200, result, `You are now ${isOnline ? "online" : "offline"}.`)
//   );
// });

const toggleOnlineStatus = asyncHandler(async (req, res) => {
  // Frontend se latitude aur longitude bhi accept karo
  const { isOnline, latitude, longitude } = req.body; 
  if (typeof isOnline !== "boolean") throw new ApiError(400, "isOnline must be true or false.");

  const result = await providerService.toggleOnlineStatus(req.user._id, isOnline, latitude, longitude);
  res.status(200).json(
    new ApiResponse(200, result, `You are now ${isOnline ? "online" : "offline"}.`)
  );
});

// PUT /api/providers/availability
const updateAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  if (!availability) throw new ApiError(400, "availability object is required.");
  const result = await providerService.updateAvailability(req.user._id, availability);
  res.status(200).json(new ApiResponse(200, result, "Availability updated."));
});

// GET /api/providers/my-stats
// Returns live MongoDB stats: total, completed, todayJobs, earnings
const getMyStats = asyncHandler(async (req, res) => {
  const stats = await providerService.getProviderStats(req.user._id);
  res.status(200).json(new ApiResponse(200, stats, "Provider stats fetched."));
});

// GET /api/providers/my-earnings
const getMyEarnings = asyncHandler(async (req, res) => {
  const { timeframe } = req.query; // 'this_week', 'this_month', 'all_time'
  const earnings = await providerService.getProviderEarnings(req.user._id, timeframe);
  res.status(200).json(new ApiResponse(200, earnings, "Provider earnings fetched."));
});

module.exports = {
  getNearbyProviders, getMyProviderProfile, getProviderById,
  updateProviderProfile, toggleOnlineStatus, updateAvailability, getMyStats, getMyEarnings
};
