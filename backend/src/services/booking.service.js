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
    isOnline:   true,
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
  await Booking.findByIdAndUpdate(booking._id, { providerResponseDeadline: deadline });

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
  const booking = await Booking.create({
    customerId,
    ...bookingData,
    statusHistory: [{ status: "pending", changedBy: customerId, note: "Booking created" }],
  });
  await notifyNextProvider(booking);
  return Booking.findById(booking._id)
    .populate("customerId", "name phone")
    .populate("categoryId", "name icon");
};

const acceptBooking = async (bookingId, providerUserId) => {
  const provider = await Provider.findOne({ userId: providerUserId });
  if (!provider) throw new ApiError(404, "Provider profile not found.");

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (booking.status !== "pending") throw new ApiError(400, "Booking is no longer pending.");

  const updated = await Booking.findByIdAndUpdate(bookingId, {
    status: "confirmed", providerId: provider._id, acceptedAt: new Date(),
    $push: { statusHistory: { status: "confirmed", changedBy: providerUserId, note: "Provider accepted" } },
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
    $push: {
      rejectedProviders: provider._id,
      statusHistory: { status: "pending", changedBy: providerUserId, note: `Rejected: ${reason || "no reason"}` },
    },
  }, { new: true });
  if (!booking) throw new ApiError(404, "Booking not found.");

  await notifyNextProvider(booking);
  return { message: "Rejected. Finding next available provider." };
};

const updateBookingStatus = async (bookingId, status, userId) => {
  const transitions = {
    confirmed:           ["provider_on_the_way", "cancelled"],
    provider_on_the_way: ["in_progress"],
    in_progress:         ["completed"],
  };
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(404, "Booking not found.");
  if (!transitions[booking.status] || !transitions[booking.status].includes(status)) {
    throw new ApiError(400, `Cannot move from "${booking.status}" to "${status}".`);
  }

  const update = { status, $push: { statusHistory: { status, changedBy: userId } } };
  if (status === "in_progress") update.startedAt   = new Date();
  if (status === "completed")   update.completedAt = new Date();
  if (status === "completed") {
    await Provider.findByIdAndUpdate(booking.providerId, { $inc: { completedBookings: 1, totalBookings: 1 } });
  }

  const updated = await Booking.findByIdAndUpdate(bookingId, update, { new: true })
    .populate("customerId", "name fcmToken");

  const messages = {
    provider_on_the_way: "Your provider is on the way!",
    in_progress:         "Service has started.",
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
  if (!["pending", "confirmed"].includes(booking.status)) throw new ApiError(400, "Cannot cancel at this stage.");

  return Booking.findByIdAndUpdate(bookingId, {
    status: "cancelled",
    cancellation: { cancelledBy: userId, reason, cancelledAt: new Date() },
    $push: { statusHistory: { status: "cancelled", changedBy: userId, note: reason || "Cancelled by customer" } },
  }, { new: true });
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
  const filter = { providerId: provider._id };
  if (query.status) filter.status = query.status;
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

module.exports = {
  createBooking, acceptBooking, rejectBooking, updateBookingStatus,
  cancelBooking, getCustomerBookings, getProviderBookings, getBookingById,
};
