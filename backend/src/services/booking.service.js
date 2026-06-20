// booking.service.js — Urban Company booking assignment logic
const Booking      = require("../models/Booking.model");
const Provider     = require("../models/Provider.model");
const User         = require("../models/User.model");
const { Notification } = require("../models/Other.model");
const ApiError     = require("../utils/ApiError");
const { getPagination, paginate } = require("../utils/pagination");
const { sendPushNotification }    = require("../config/firebase");

// Find nearest provider and notify them
const notifyNextProvider = async (booking) => {
  const provider = await Provider.findOne({
    isVerified: true,
    status:     "online",
    skills:     booking.categoryId,
    _id:        { $nin: booking.rejectedProviders },
    currentLocation: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: booking.address.location.coordinates },
        $maxDistance: 15000,
      },
    },
  }).populate("userId", "name fcmToken");

  if (!provider) {
    await Booking.findByIdAndUpdate(booking._id, {
      status: "rejected",
      $push:  { statusHistory: { status: "rejected", note: "No available providers nearby" } },
    });
    const customer = await User.findById(booking.customerId).select("fcmToken");
    if (customer && customer.fcmToken) {
      await sendPushNotification(customer.fcmToken, "No Providers Available",
        "We couldn't find a provider nearby. Please try again.", { bookingId: String(booking._id) });
    }
    return;
  }

  const deadline = new Date(Date.now() + 2 * 60 * 1000);
  await Booking.findByIdAndUpdate(booking._id, {
    notifiedProviderId: provider._id,
    providerResponseDeadline: deadline
  });

  if (provider.userId && provider.userId.fcmToken) {
    await sendPushNotification(provider.userId.fcmToken, "New Job Request!",
      "A new booking request is available near you.",
      { bookingId: String(booking._id), screen: "BookingRequest", type: "booking_request" });
  }

  await Notification.create({
    userId: provider.userId._id,
    title:  "New Job Request!",
    body:   "A new booking request is waiting for your response.",
    type:   "booking_request",
    data:   { bookingId: String(booking._id) },
  });
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

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (booking.status !== "pending") throw new ApiError(400, "Booking is no longer pending.");

  const updated = await Booking.findByIdAndUpdate(bookingId, {
    status: "accepted",
    providerId: provider._id,
    notifiedProviderId: null,
    acceptedAt: new Date(),
    $push: { statusHistory: { status: "accepted", changedBy: providerUserId, note: "Provider accepted" } },
  }, { new: true }).populate("customerId", "name phone fcmToken");

  if (updated.customerId && updated.customerId.fcmToken) {
    await sendPushNotification(updated.customerId.fcmToken, "Booking Confirmed!",
      "A provider has accepted your request.",
      { bookingId: String(bookingId), screen: "BookingTrack" });
  }
  await Notification.create({
    userId: updated.customerId._id,
    title:  "Booking Confirmed!",
    body:   "A provider accepted your request and is on the way.",
    type:   "booking_confirmed",
    data:   { bookingId: String(bookingId) },
  });
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
    accepted:            ["confirmed", "cancelled"],
    confirmed:           ["provider_on_the_way", "cancelled"],
    provider_on_the_way: ["arrived", "cancelled"],
    arrived:             ["otp_verification", "in_progress", "cancelled"],
    otp_verification:    ["in_progress", "cancelled"],
    in_progress:         ["payment_pending"],
    payment_pending:     ["completed"],
  };
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (!transitions[booking.status] || !transitions[booking.status].includes(status)) {
    throw new ApiError(400, `Cannot move from "${booking.status}" to "${status}".`);
  }

  // OTP Validation when entering "in_progress" state
  if (status === "in_progress") {
    if (!otp) {
      throw new ApiError(400, "OTP is required to start the service.");
    }
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
      status: "online",
      $inc: { completedBookings: 1, totalBookings: 1 } 
    });
  }
  if (status === "cancelled") {
    if (booking.providerId) {
      await Provider.findByIdAndUpdate(booking.providerId, { status: "online" });
    }
  }

  const updated = await Booking.findByIdAndUpdate(bookingId, update, { new: true })
    .populate("customerId", "name fcmToken")
    .populate("categoryId", "name icon")
    .populate({ path: "providerId", populate: { path: "userId", select: "name phone profilePhoto" } });

  const messages = {
    provider_on_the_way: "Your provider is on the way!",
    arrived:             "Your provider has arrived at your location.",
    otp_verification:    "Verify OTP with your provider to start the service.",
    in_progress:         "Service has started.",
    payment_pending:     "Service completed. Payment is pending.",
    completed:           "Service completed! Please rate your experience.",
  };

  if (updated.customerId && updated.customerId.fcmToken && messages[status]) {
    await sendPushNotification(updated.customerId.fcmToken, "Booking Update",
      messages[status], { bookingId: String(bookingId), screen: "BookingTrack" });
  }
  return updated;
};

const cancelBooking = async (bookingId, userId, reason) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (String(booking.customerId) !== String(userId)) throw new ApiError(403, "You can only cancel your own bookings.");

  if (!["pending", "accepted", "confirmed", "provider_on_the_way", "arrived", "otp_verification"].includes(booking.status)) {
    throw new ApiError(400, "Cannot cancel at this stage.");
  }

  // Reset assigned provider status back to online
  if (booking.providerId) {
    await Provider.findByIdAndUpdate(booking.providerId, { status: "online" });
  }

  const updated = await Booking.findByIdAndUpdate(bookingId, {
    status: "cancelled",
    cancellation: { cancelledBy: userId, reason, cancelledAt: new Date() },
    $push: { statusHistory: { status: "cancelled", changedBy: userId, note: reason || "Cancelled by customer" } },
  }, { new: true });

  // ── Notify the notified (pending-response) provider if present ──
  if (booking.notifiedProviderId) {
    try {
      const notifiedProvider = await Provider.findById(booking.notifiedProviderId)
        .populate("userId", "fcmToken name");
      if (notifiedProvider && notifiedProvider.userId) {
        if (notifiedProvider.userId.fcmToken) {
          await sendPushNotification(
            notifiedProvider.userId.fcmToken,
            "Booking Cancelled",
            "The booking request you received has been cancelled by the customer.",
            { bookingId: String(bookingId), type: "booking_cancelled" }
          );
        }
        await Notification.create({
          userId: notifiedProvider.userId._id,
          title:  "Booking Cancelled",
          body:   "The booking request you received has been cancelled by the customer.",
          type:   "booking_cancelled",
          data:   { bookingId: String(bookingId) },
        });
      }
    } catch (err) {
      // Non-fatal: log but don't block the cancellation response
      console.error("⚠️  [cancelBooking] Failed to notify provider:", err.message);
    }
  }

  return updated;
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
  );

  // Trigger searching next provider
  await notifyNextProvider(updatedBooking);

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

module.exports = {
  createBooking, acceptBooking, rejectBooking, updateBookingStatus,
  cancelBooking, getCustomerBookings, getProviderBookings, getBookingById,
  cancelJobByProvider, requestReschedule, respondReschedule,
};
