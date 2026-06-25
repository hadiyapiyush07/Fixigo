// booking.service.js — Urban Company booking assignment logic
const Booking      = require("../models/Booking.model");
const Provider     = require("../models/Provider.model");
const User         = require("../models/User.model");
const Notification = require("../models/Notification.model");
const Coupon       = require("../models/Coupon.model");
const ApiError     = require("../utils/ApiError");
const { getPagination, paginate } = require("../utils/pagination");
const notificationService = require("./notification.service");

// Find nearest provider and notify them
const RADIUS_STEPS = [3000, 5000, 8000, 12000, 20000];

const notifyNextProvider = async (booking) => {
  const coordinates = booking.address?.location?.coordinates;
  console.log(`\n🔍 [notifyNextProvider] Searching for Booking ${booking._id}`);
  console.log(`📍 Booking coordinates:`, coordinates);
  console.log(`🛠️ Booking Category:`, booking.categoryId);

  if (!coordinates || coordinates.length !== 2) {
    console.error(`❌ [notifyNextProvider] Invalid coordinates! Aborting search.`);
    return;
  }

  let selectedProvider = null;

  for (const radius of RADIUS_STEPS) {
    console.log(`\n🔄 [notifyNextProvider] Expanding search to radius: ${radius}m`);
    
    // Find all providers matching criteria within this radius
    const providers = await Provider.find({
      skills: booking.categoryId,
      _id: { $nin: booking.rejectedProviders },
      status: "available",
      isVerified: true,
      currentLocation: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates },
          $maxDistance: radius,
        }
      }
    }).populate("userId", "name fcmToken");

    console.log(`📊 Found ${providers.length} available providers in ${radius}m radius`);

    // Sort providers by Rating, Acceptance Rate, etc.
    const sortedProviders = providers.sort((a, b) => {
      // Primary: Rating (Descending)
      if (b.metrics?.rating !== a.metrics?.rating) return (b.metrics?.rating || 0) - (a.metrics?.rating || 0);
      // Secondary: Acceptance Rate
      return (b.metrics?.acceptanceRate || 0) - (a.metrics?.acceptanceRate || 0);
    });

    for (const provider of sortedProviders) {
      console.log(`  -> Checking Provider: ${provider._id} (User: ${provider.userId?.name})`);
      
      selectedProvider = provider;
      console.log(`     ✅ SELECTED Provider ${provider._id} at radius ${radius}m`);
      break;
    }
    
    if (selectedProvider) break;
  }

  if (!selectedProvider) {
    console.log(`❌ [notifyNextProvider] Exhausted all radii up to 20km. No providers matched.`);
    await Booking.findByIdAndUpdate(booking._id, {
      status: "rejected",
      $push:  { statusHistory: { status: "rejected", note: "No available providers nearby" } },
    });
    const customer = await User.findById(booking.customerId).select("fcmToken");
    if (customer) {
      await notificationService.sendNotification({
        userId: customer._id,
        fcmToken: customer.fcmToken,
        title: "No Providers Available",
        body: "We couldn't find a provider nearby. Please try again.",
        type: "booking_rejected",
        data: { bookingId: String(booking._id) }
      });
    }
    return;
  }

  const deadline = new Date(Date.now() + 20 * 1000); // 20 seconds timeout
  await Booking.findByIdAndUpdate(booking._id, {
    notifiedProviderId: selectedProvider._id,
    providerResponseDeadline: deadline
  });

  if (selectedProvider.userId) {
    const { emitToUser } = require("../socket/socket");
    emitToUser(selectedProvider.userId._id, "booking:new", { bookingId: String(booking._id) });

    await notificationService.sendNotification({
      userId: selectedProvider.userId._id,
      fcmToken: selectedProvider.userId.fcmToken,
      title: "New Job Request!",
      body: "A new booking request is waiting for your response.",
      type: "booking_request",
      data: { bookingId: String(booking._id), screen: "BookingRequest" }
    });
  }
};

const createBooking = async (customerId, bookingData) => {
  const { cloudinary } = require("../config/cloudinary");

  console.log("\n🟡 [booking.service] createBooking called");
  console.log("  customerId  :", String(customerId));
  console.log("  categoryId  :", bookingData.categoryId);
  console.log("  subService  :", JSON.stringify(bookingData.subService));
  console.log("  subServices :", JSON.stringify(bookingData.subServices));
  console.log("  pricing     :", JSON.stringify(bookingData.pricing));
  console.log("  address     :", bookingData.address?.addressLine, "/", bookingData.address?.city);

  // ── Upload reference images to Cloudinary ────────────────
  let uploadedImages = [];
  if (bookingData.images && Array.isArray(bookingData.images)) {
    for (const img of bookingData.images) {
      if (img && img.startsWith("data:image")) {
        try {
          const result = await cloudinary.uploader.upload(img, { folder: "servicebook/bookings" });
          uploadedImages.push(result.secure_url);
        } catch (err) {
          console.error("⚠️  Cloudinary upload failed for booking image:", err.message);
        }
      } else if (img) {
        uploadedImages.push(img);
      }
    }
  }

  // ── Build the subService legacy field from subServices array ─
  // subService (singular) is kept for backward compat with older queries
  let subServiceLegacy = bookingData.subService || { name: "General Service", price: 0 };
  const subServicesArr = bookingData.subServices || [];

  if (subServicesArr.length > 0 && !bookingData.subService) {
    // Auto-build legacy field from multi-selection
    subServiceLegacy = {
      name:  subServicesArr.map(s => s.name).join(", "),
      price: subServicesArr.reduce((acc, s) => acc + (Number(s.price) || 0), 0),
    };
  }

  console.log("  → subServiceLegacy :", JSON.stringify(subServiceLegacy));
  console.log("  → subServicesArr   :", JSON.stringify(subServicesArr));
  console.log("  → uploadedImages   :", uploadedImages.length);

  // ── Record coupon usage if provided ───────────────────────
  if (bookingData.couponCode) {
    try {
      const coupon = await Coupon.findOne({ code: bookingData.couponCode.toUpperCase() });
      if (coupon) {
        coupon.usedBy.push({ userId: customerId });
        await coupon.save();
        console.log(`🎟️ [booking.service] Recorded coupon usage for ${coupon.code} by user ${customerId}`);
      }
    } catch (err) {
      console.error("⚠️ Failed to record coupon usage:", err.message);
    }
  }

  // ── Build booking document ────────────────────────────────
  const bookingDoc = {
    customerId,
    categoryId:    bookingData.categoryId,
    subService:    subServiceLegacy,
    subServices:   subServicesArr,
    description:   bookingData.description || "",
    images:        uploadedImages,
    scheduledDate: bookingData.scheduledDate || new Date(),
    scheduledTime: bookingData.scheduledTime || "Instant",
    address:       bookingData.address,
    pricing:       bookingData.pricing || { baseAmount: 0, convenienceFee: 0, discount: 0, totalAmount: 0 },
    couponCode:    bookingData.couponCode || null,
    statusHistory: [{ status: "pending", changedBy: customerId, note: "Booking created" }],
  };

  console.log("📝 [booking.service] Creating booking document...");

  let booking;
  try {
    booking = await Booking.create(bookingDoc);
    console.log("✅ [booking.service] Booking created with _id:", String(booking._id));
  } catch (err) {
    console.error("❌ [booking.service] Booking.create() FAILED!");
    console.error("   Error name   :", err.name);
    console.error("   Error message:", err.message);
    console.error("   Stack        :", err.stack);
    if (err.errors) {
      Object.entries(err.errors).forEach(([field, detail]) => {
        console.error(`   Validation error on field "${field}": ${detail.message}`);
      });
    }
    throw err;
  }

  await notifyNextProvider(booking);

  return Booking.findById(booking._id)
    .populate("customerId", "name phone")
    .populate("categoryId", "name icon");
};


const acceptBooking = async (bookingId, providerUserId) => {
  const provider = await Provider.findOne({ userId: providerUserId });
  if (!provider) throw new ApiError(404, "Provider profile not found.");

  if (!provider.isVerified) {
    if (provider.verificationStatus === "rejected") {
      throw new ApiError(403, "Provider is not verified. Your profile verification was rejected. Please update your profile or contact support.");
    }
    throw new ApiError(403, "Provider is not verified. Your profile is under verification. Please wait until the admin approves your account.");
  }
  
  if (provider.status !== "available") {
    throw new ApiError(400, "You must be 'Available' to accept a booking.");
  }

  // ATOMIC UPDATE: Ensure no double booking acceptance
  const updated = await Booking.findOneAndUpdate(
    { _id: bookingId, status: "pending" }, // Strictly match pending state
    {
      $set: {
        status: "confirmed",
        providerId: provider._id,
        notifiedProviderId: null,
        acceptedAt: new Date(),
      },
      $push: { 
        statusHistory: [
          { status: "accepted", changedBy: providerUserId, note: "Provider accepted" },
          { status: "confirmed", changedBy: providerUserId, note: "Auto-transition to confirmed" }
        ]
      }
    },
    { new: true }
  ).populate("customerId", "name phone fcmToken");

  if (!updated) {
    throw new ApiError(400, "Booking already accepted by another provider or expired.");
  }

  // Automatically mark provider as busy
  await Provider.findByIdAndUpdate(provider._id, { 
    status: "busy", 
    $inc: { "metrics.acceptedJobs": 1 } 
  });

  if (updated.customerId) {
    await notificationService.sendNotification({
      userId: updated.customerId._id,
      fcmToken: updated.customerId.fcmToken,
      title: "Booking Confirmed!",
      body: "A provider has accepted your request and is assigned.",
      type: "booking_confirmed",
      data: { bookingId: String(bookingId), screen: "BookingTrack" }
    });
  }

  return updated;
};

const rejectBooking = async (bookingId, providerUserId, reason) => {
  const provider = await Provider.findOne({ userId: providerUserId });
  if (!provider) throw new ApiError(404, "Provider not found.");

  const booking = await Booking.findByIdAndUpdate(bookingId, {
    notifiedProviderId: null,
    $push: {
      rejectedProviders: provider._id,
      statusHistory: { status: "pending", changedBy: providerUserId, note: `Rejected: ${reason || "no reason"}` },
    },
  }, { new: true });
  if (!booking) throw new ApiError(404, "Booking not found.");

  await notifyNextProvider(booking);
  return { message: "Rejected. Finding next available provider." };
};

const updateBookingStatus = async (bookingId, status, userId, otp) => {
  const transitions = {
    pending:             ["cancelled"],
    accepted:            ["confirmed", "cancelled"], // Kept for safety
    confirmed:           ["provider_on_the_way", "cancelled"],
    provider_on_the_way: ["arrived", "cancelled"],
    arrived:             ["otp_verification", "in_progress", "cancelled"],
    otp_verification:    ["in_progress", "cancelled"],
    in_progress:         ["payment_pending"],
    payment_pending:     ["completed"],
  };
  const booking = await Booking.findById(bookingId).populate("customerId", "fcmToken _id");
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (!transitions[booking.status] || !transitions[booking.status].includes(status)) {
    throw new ApiError(400, `Cannot move from "${booking.status}" to "${status}". Strict forward transitions enforced.`);
  }

  // Legacy fallback: handled directly via updateBookingStatus without verifyOtp endpoint
  if (status === "in_progress" && otp) {
    if (booking.startOtp !== otp.toString().trim()) {
      throw new ApiError(400, "Invalid OTP. Please ask the customer for the correct OTP.");
    }
  }

  const update = { status, $push: { statusHistory: { status, changedBy: userId } } };
  
  if (status === "provider_on_the_way") {
    const crypto = require("crypto");
    // Generate secure 4-digit OTP using crypto.randomInt
    const generatedOtp = crypto.randomInt(1000, 9999).toString();
    update.startOtp = generatedOtp;
  }
  if (status === "in_progress") {
    update.startedAt = new Date();
    update.startOtp = null; // Clear OTP once service starts
    await Provider.findByIdAndUpdate(booking.providerId, { status: "busy" });
  }
  if (status === "completed") {
    update.completedAt = new Date();
    await Provider.findByIdAndUpdate(booking.providerId, { 
      status: "available",
      $inc: { completedBookings: 1, totalBookings: 1 } 
    });
  }
  if (status === "cancelled") {
    if (booking.providerId) {
      await Provider.findByIdAndUpdate(booking.providerId, { status: "available" });
    }
  }

  // Inject Notifications based on status
  const notifyMap = {
    // provider_on_the_way: { title: "Provider On The Way", body: "Your provider has started the journey.", type: "provider_on_the_way" },
    // arrived:             { title: "Provider Arrived", body: "Your provider has arrived at your location.", type: "provider_arrived" },
    // in_progress:         { title: "Service Started", body: "Your provider has started working.", type: "service_started" },
    // payment_pending:     { title: "Payment Pending", body: "Service is complete. Please complete the payment.", type: "payment_pending" },
    completed:           { title: "Service Complete", body: "Thank you for using Fixigo!", type: "booking_completed" },
  };

  if (notifyMap[status] && booking.customerId) {
    await notificationService.sendNotification({
      userId: booking.customerId._id,
      fcmToken: booking.customerId.fcmToken,
      title: notifyMap[status].title,
      body: notifyMap[status].body,
      type: notifyMap[status].type,
      data: { bookingId: String(bookingId) }
    });
  }

  const updatedBooking = await Booking.findByIdAndUpdate(bookingId, update, { new: true });
  
  // Real-time Socket Emitting
  const { emitToBooking } = require("../socket/socket");
  emitToBooking(bookingId, "statusUpdated", { status, timestamp: new Date() });
  
  return updatedBooking;
};

const cancelBooking = async (bookingId, customerUserId, reason) => {
  const booking = await Booking.findById(bookingId).populate("providerId", "userId");
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (booking.status === "completed" || booking.status === "cancelled") {
    throw new ApiError(400, `Booking is already ${booking.status}`);
  }

  const structuredReason = reason || "Cancelled by customer";
  booking.status = "cancelled";
  booking.cancellation = { cancelledBy: customerUserId, reason: structuredReason, cancelledAt: new Date() };
  booking.statusHistory.push({ status: "cancelled", changedBy: customerUserId, note: structuredReason });
  await booking.save();

  if (booking.providerId) {
    await Provider.findByIdAndUpdate(booking.providerId._id, { status: "available" });
    const providerUser = await User.findById(booking.providerId.userId).select("fcmToken");
    if (providerUser) {
      await notificationService.sendNotification({
        userId: providerUser._id,
        fcmToken: providerUser.fcmToken,
        title: "Booking Cancelled",
        body: `Customer cancelled the booking: ${structuredReason}`,
        type: "booking_cancelled",
        data: { bookingId: String(bookingId) }
      });
    }
  } else if (booking.notifiedProviderId) {
    // Notify the provider who was just asked but didn't accept yet
    const provider = await Provider.findById(booking.notifiedProviderId).populate("userId", "fcmToken");
    if (provider && provider.userId) {
      await notificationService.sendNotification({
        userId: provider.userId._id,
        fcmToken: provider.userId.fcmToken,
        title: "Booking Cancelled",
        body: "The customer cancelled their request.",
        type: "booking_cancelled",
        data: { bookingId: String(bookingId) }
      });
    }
  }
  return booking;
};

const getCustomerBookings = async (customerId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { customerId };
  if (query.status) filter.status = query.status;
  const [data, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate("categoryId", "name icon")
      .populate({ path: "providerId", populate: { path: "userId", select: "name profilePhoto" } })
      .select("-statusHistory -rejectedProviders"),
    Booking.countDocuments(filter),
  ]);
  return paginate(data, total, page, limit);
};

const getProviderBookings = async (providerUserId, query) => {
  const { page, limit, skip } = getPagination(query);
  const provider = await Provider.findOne({ userId: providerUserId });
  if (!provider) throw new ApiError(404, "Provider not found.");
  let filter = {};
  if (query.status) {
    if (query.status === "pending") {
      filter = { notifiedProviderId: provider._id, status: "pending" };
    } else {
      filter = { providerId: provider._id, status: query.status };
    }
  } else {
    filter = {
      $or: [
        { providerId: provider._id },
        { notifiedProviderId: provider._id, status: "pending" }
      ]
    };
  }
  const [data, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .populate("customerId", "name phone profilePhoto")
      .populate("categoryId", "name icon")
      .select("-rejectedProviders"),
    Booking.countDocuments(filter),
  ]);
  return paginate(data, total, page, limit);
};

const getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId)
    .populate("customerId", "name phone profilePhoto")
    .populate("categoryId", "name icon basePrice")
    .populate({ path: "providerId", populate: { path: "userId", select: "name phone profilePhoto" } });
  if (!booking) throw new ApiError(404, "Booking not found.");
  const isCustomer = String(booking.customerId._id) === String(userId);
  const isProvider = booking.providerId && String(booking.providerId.userId && booking.providerId.userId._id) === String(userId);
  if (!isCustomer && !isProvider) throw new ApiError(403, "Access denied.");
  return booking;
};

const cancelJobByProvider = async (bookingId, providerUserId, reason) => {
  const provider = await Provider.findOne({ userId: providerUserId });
  if (!provider) throw new ApiError(404, "Provider profile not found.");

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");

  if (String(booking.providerId) !== String(provider._id)) {
    throw new ApiError(403, "You are not assigned to this booking.");
  }

  // Update provider status back to online
  provider.status = "online";
  await provider.save();

  // Update booking:
  // - Add current provider to rejectedProviders
  // - Clear providerId, notifiedProviderId, and reset status to pending
  // - Push status history
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    {
      providerId: null,
      notifiedProviderId: null,
      status: "pending",
      $push: {
        rejectedProviders: provider._id,
        statusHistory: {
          status: "pending",
          changedBy: providerUserId,
          note: `Cancelled by provider: ${reason || "No reason provided"}`
        }
      }
    },
    { new: true }
  ).populate("customerId", "fcmToken _id");

  // Trigger searching next provider
  await notifyNextProvider(updatedBooking);

  if (updatedBooking.customerId) {
    await notificationService.sendNotification({
      userId: updatedBooking.customerId._id,
      fcmToken: updatedBooking.customerId.fcmToken,
      title: "Provider Unassigned",
      body: "We are reassigning your booking to another professional.",
      type: "booking_reassigned",
      data: { bookingId: String(bookingId) }
    });
  }

  return updatedBooking;
};

const requestReschedule = async (bookingId, userId, role, { proposedDate, proposedTime, reason }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");

  if (role === "provider") {
    const provider = await Provider.findOne({ userId });
    if (!provider || String(booking.providerId) !== String(provider._id)) {
      throw new ApiError(403, "You are not authorized to reschedule this booking.");
    }
  } else {
    if (String(booking.customerId) !== String(userId)) {
      throw new ApiError(403, "You are not authorized to reschedule this booking.");
    }
  }

  booking.rescheduleRequest = {
    proposedDate,
    proposedTime,
    requestedBy: role,
    status: "pending",
    reason
  };

  await booking.save();
  return booking;
};

const respondReschedule = async (bookingId, userId, { response }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");

  if (String(booking.customerId) !== String(userId)) {
    throw new ApiError(403, "Only the customer can respond to reschedule requests.");
  }

  if (!booking.rescheduleRequest || booking.rescheduleRequest.status !== "pending") {
    throw new ApiError(400, "No pending reschedule request found.");
  }

  if (response === "approved") {
    booking.scheduledDate = booking.rescheduleRequest.proposedDate;
    booking.scheduledTime = booking.rescheduleRequest.proposedTime;
    booking.rescheduleRequest.status = "approved";
    booking.statusHistory.push({
      status: booking.status,
      changedBy: userId,
      note: `Reschedule approved. New time: ${booking.scheduledTime}`
    });
    await booking.save();
    return booking;
  } else if (response === "declined") {
    booking.rescheduleRequest.status = "declined";
    
    // If declined, reassign to another provider!
    const provider = await Provider.findById(booking.providerId);
    if (provider) {
      provider.status = "online";
      await provider.save();
      booking.rejectedProviders.push(provider._id);
    }
    
    booking.providerId = null;
    booking.notifiedProviderId = null;
    booking.status = "pending";
    booking.statusHistory.push({
      status: "pending",
      changedBy: userId,
      note: "Reschedule declined by customer. Reassigning..."
    });

    await booking.save();
    await notifyNextProvider(booking);
    return Booking.findById(booking._id);
  } else {
    throw new ApiError(400, "Invalid response. Expected 'approved' or 'declined'.");
  }
};

const verifyOtp = async (bookingId, providerUserId, otp) => {
  const provider = await Provider.findOne({ userId: providerUserId });
  if (!provider) throw new ApiError(404, "Provider not found.");

  const booking = await Booking.findById(bookingId).populate("customerId", "fcmToken _id");
  if (!booking) throw new ApiError(404, "Booking not found.");
  
  if (String(booking.providerId) !== String(provider._id)) {
    throw new ApiError(403, "You are not assigned to this booking.");
  }
  
  if (booking.status !== "arrived" && booking.status !== "otp_verification") {
    throw new ApiError(400, "Booking must be in arrived status to verify OTP.");
  }

  if (booking.otpBlockedUntil && new Date() < booking.otpBlockedUntil) {
    throw new ApiError(403, `Too many attempts. Blocked until ${new Date(booking.otpBlockedUntil).toLocaleTimeString()}`);
  }

  if (booking.startOtp !== otp.toString().trim()) {
    booking.otpAttempts = (booking.otpAttempts || 0) + 1;
    if (booking.otpAttempts >= 5) {
      booking.otpBlockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins block
    }
    await booking.save();
    throw new ApiError(400, "Invalid OTP. Please ask the customer for the correct OTP.");
  }

  // OTP Expiry (10 mins)
  if (booking.otpGeneratedAt && (Date.now() - new Date(booking.otpGeneratedAt).getTime() > 10 * 60 * 1000)) {
    throw new ApiError(400, "OTP has expired. Please ask the customer to generate a new OTP.");
  }

  // Success
  booking.otpVerified = true;
  booking.otpVerifiedAt = new Date();
  booking.startOtp = null; // Clear OTP
  booking.status = "in_progress";
  booking.startedAt = new Date();
  booking.statusHistory.push({ status: "otp_verification", changedBy: providerUserId, note: "OTP Verified" });
  booking.statusHistory.push({ status: "in_progress", changedBy: providerUserId, note: "Service Started" });
  await booking.save();

  await Provider.findByIdAndUpdate(provider._id, { status: "busy" });

  if (booking.customerId?.fcmToken) {
    // await notificationService.sendNotification({
    //   userId: booking.customerId._id,
    //   fcmToken: booking.customerId.fcmToken,
    //   title: "Service Started!",
    //   body: "OTP verified successfully. Your service is now in progress.",
    //   type: "service_started",
    //   data: { bookingId: String(bookingId), screen: "BookingTrack" }
    // });
  }

  // Real-time Socket Emitting
  const { emitToBooking } = require("../socket/socket");
  emitToBooking(bookingId, "statusUpdated", { status: "in_progress", timestamp: new Date() });

  return Booking.findById(bookingId).populate("customerId", "name fcmToken _id");
};

const getLiveLocation = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking || !booking.providerId) throw new ApiError(404, "Provider or Booking not found.");

  const provider = await Provider.findById(booking.providerId);
  if (!provider || !provider.currentLocation || !provider.currentLocation.coordinates) {
    throw new ApiError(404, "Location not available.");
  }

  return {
    latitude: provider.currentLocation.coordinates[1],
    longitude: provider.currentLocation.coordinates[0],
    heading: provider.heading || 0,
    speed: provider.speed || 0,
    updatedAt: provider.lastLocationUpdated || provider.updatedAt
  };
};

const Review = require("../models/Review.model");

const submitReview = async (bookingId, customerId, rating, reviewText) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (String(booking.customerId) !== String(customerId)) throw new ApiError(403, "Not authorized.");
  if (booking.status !== "completed") throw new ApiError(400, "Service must be completed to review.");
  if (booking.isRated) throw new ApiError(400, "Booking already reviewed.");

  const review = await Review.create({
    bookingId, customerId, providerId: booking.providerId, rating, reviewText
  });

  booking.isRated = true;
  booking.reviewId = review._id;
  await booking.save();

  // Recalculate provider rating
  const stats = await Review.aggregate([
    { $match: { providerId: booking.providerId } },
    { $group: { _id: "$providerId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);

  if (stats.length > 0) {
    await Provider.findByIdAndUpdate(booking.providerId, {
      "rating.average": Math.round(stats[0].avgRating * 10) / 10,
      "rating.count": stats[0].count
    });
  }

  return review;
};

module.exports = {
  createBooking, acceptBooking, rejectBooking, updateBookingStatus,
  cancelBooking, getCustomerBookings, getProviderBookings, getBookingById,
  cancelJobByProvider, requestReschedule, respondReschedule, verifyOtp,
  getLiveLocation, submitReview
};
